import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { execSync, spawnSync } from "child_process";

const gcpConfig = new pulumi.Config("gcp");
const pulumiConfig = new pulumi.Config();
const projectName = "treasury-subgraph";
const projectStackName = `${projectName}-${pulumi.getStack()}`;

/**
 * Enable services
 */
const serviceArtifactRegistry = new gcp.projects.Service("artifact-registry", {
  service: "artifactregistry.googleapis.com",
});
const serviceCloudRun = new gcp.projects.Service("cloud-run", {
  service: "run.googleapis.com",
});
const serviceFirebase = new gcp.projects.Service("firebase", {
  service: "firebase.googleapis.com",
});

/**
 * Copy required files
 */
execSync("mkdir -p tmp");
execSync("cp ../../yarn.lock tmp/yarn.lock");

/**
 * Docker images
 */
// Create Docker repository
const dockerRepository = new gcp.artifactregistry.Repository(projectName, {
  repositoryId: projectName,
  project: gcpConfig.require("project"),
  location: gcpConfig.require("region"),
  format: "DOCKER",
}, {
  dependsOn: [serviceArtifactRegistry],
});

const getGitCommit = (throwIfUncommitted = true) => {
  if (throwIfUncommitted) {
    console.log("Checking for uncommitted changes...");
    const spawnOutput = spawnSync(`git status --porcelain`, { shell: true });
    console.log(`git diff returned status of ${spawnOutput.status}`);

    if (spawnOutput.stdout.toString().length > 0) {
      throw new Error("Uncommitted changes found! Commit them before continuing.");
    }
  }

  // Strip trailing newline
  return execSync("git rev-parse --short HEAD").toString().replace("\n", "");
}

const getDockerImageLabel = (projectName: string, imageVersion: string) => {
  return pulumi.interpolate`gcr.io/${gcpConfig.require("project")}/${projectName}:${imageVersion}`;
};

const createDockerImage = (resourceName: string, imageVersion: string, dependsOn?: pulumi.Resource[]) => {
  const imageCurrent = getDockerImageLabel(projectName, imageVersion);
  const imageLatest = getDockerImageLabel(projectName, "latest");

  return new docker.Image(resourceName, {
    imageName: imageCurrent,
    build: {
      args: {
        BUILDKIT_INLINE_CACHE: "1",
        ARBITRUM_SUBGRAPH_API_KEY: pulumiConfig.requireSecret("ARBITRUM_SUBGRAPH_API_KEY"),
        UPSTASH_REDIS_URL: pulumiConfig.requireSecret("UPSTASH_REDIS_URL"),
      },
      cacheFrom: {
        images: [imageLatest],
      },
      builderVersion: "BuilderBuildKit",
      platform: "linux/amd64",
    },
  }, {
    dependsOn: dependsOn,
  });
};

// Build Docker images
const dockerImageGitCommit = createDockerImage(`${projectName}-git-commit`, getGitCommit(false), [dockerRepository]);
const dockerImageLatest = createDockerImage(`${projectName}-latest`, "latest", [dockerImageGitCommit, dockerRepository]);

/**
 * Cloud Run
 */
const cloudRun = new gcp.cloudrunv2.Service(
  projectName,
  {
    location: gcpConfig.require("region"),
    template: {
      maxInstanceRequestConcurrency: 20, // Seems to be a good balance with 1GB memory
      containers: [
        {
          image: dockerImageGitCommit.imageName,
          resources: {
            limits: {
              memory: "1024Mi",
              cpu: "1",
            },
            cpuIdle: true,
          },
          ports: [
            {
              containerPort: 9991,
            }
          ],
          // Needed at runtime
          envs: [
            {
              name: "ARBITRUM_SUBGRAPH_API_KEY",
              value: pulumiConfig.requireSecret("ARBITRUM_SUBGRAPH_API_KEY"),
            },
            {
              name: "UPSTASH_REDIS_URL",
              value: pulumiConfig.requireSecret("UPSTASH_REDIS_URL"),
            },
            {
              name: "CACHE_ENABLED",
              value: "false",
            }
          ]
        }
      ]
    },
  },
  {
    dependsOn: [serviceCloudRun, dockerImageGitCommit],
  },
);

// Enable the Cloud Run service to be invoked by Firebase Hosting
const noauthIAMPolicy = gcp.organizations.getIAMPolicy({
  bindings: [{
    role: "roles/run.invoker",
    members: ["allUsers"],
  }],
});

const noauthIamPolicy = new gcp.cloudrun.IamPolicy("noauthIamPolicy", {
  location: gcpConfig.require("region"),
  project: gcpConfig.require("project"),
  service: cloudRun.name,
  policyData: noauthIAMPolicy.then(noauthIAMPolicy => noauthIAMPolicy.policyData),
});

/**
 * Firebase
 *
 * We utilise Firebase hosting to provide a static URL to Cloud Run.
 */

// Deploy a Firebase Hosting site, so that we can obtain a static URL
const firebaseProject = new gcp.firebase.Project(
  projectName,
  {
    project: gcpConfig.require("project"),
  },
  {
    dependsOn: [serviceFirebase],
  },
);

const firebaseHostingSite = new gcp.firebase.HostingSite(
  projectName,
  {
    project: firebaseProject.project,
    siteId: `olympus-${projectStackName}`, // Will end up as olympus-treasury-subgraph-<stack>.web.app
  },
  {
    dependsOn: [firebaseProject],
  },
);

const firebaseSiteId = firebaseHostingSite.siteId;
if (!firebaseSiteId) {
  throw new Error("Firebase Hosting site ID is undefined");
}

const firebaseSiteIdInput: pulumi.Input<string> = firebaseSiteId.apply(str => `${str}`);

// Rewrite all requests to the Cloud Run instance
const firebaseHostingVersion = new gcp.firebase.HostingVersion(
  projectName,
  {
    siteId: firebaseSiteIdInput,
    config: {
      /**
       * Firebase hosting does not forward CORS headers to the Cloud Run instance
       * when using redirects, so we need to do a rewrite.
       *
       * Pulumi's implementation does not support specifying the region of the
       * function (or does not discover the region accurately), so we need to
       * ensure that both the Cloud Function and Firebase Hosting are in the
       * default region, which is us-central1.
       */
      rewrites: [
        {
          glob: "**",
          run: {
            region: gcpConfig.require("region"),
            serviceId: cloudRun.name,
          },
        },
      ],
    },
  },
  {
    dependsOn: [firebaseHostingSite, cloudRun],
  },
);

new gcp.firebase.HostingRelease(
  projectName,
  {
    siteId: firebaseSiteIdInput,
    versionName: firebaseHostingVersion.name,
    message: "Cloud Run integration",
  },
  {
    dependsOn: [firebaseHostingVersion],
  },
);

/**
 * Alerts
 */
// Notification channel
const notificationEmail = new gcp.monitoring.NotificationChannel(
  "email",
  {
    displayName: "Email",
    type: "email",
    labels: {
      email_address: pulumiConfig.requireSecret("alertEmail"),
    },
  },
);

// High Latency
new gcp.monitoring.AlertPolicy(
  "high-latency",
  {
    displayName: `${projectName} - High Request Latency`,
    userLabels: {},
    conditions: [
      {
        displayName: `50% above 30s Latency`,
        conditionThreshold: {
          filter:
            pulumi.interpolate`
            resource.type = "cloud_run_revision" AND 
            resource.labels.service_name = "${cloudRun.name}" AND 
            metric.type = "run.googleapis.com/request_latencies"
            `,
          aggregations: [
            {
              alignmentPeriod: "300s",
              perSeriesAligner: "ALIGN_PERCENTILE_99",
            },
          ],
          comparison: "COMPARISON_GT",
          duration: "0s",
          trigger: {
            percent: 50,
          },
          thresholdValue: 30000, // 30 seconds
        },
      },
    ],
    alertStrategy: {
      autoClose: "604800s",
    },
    combiner: "AND",
    enabled: true,
    notificationChannels: [notificationEmail.name],
  },
  {
    dependsOn: [cloudRun, notificationEmail],
  },
);

// HTTP Errors
new gcp.monitoring.AlertPolicy(
  "http-errors",
  {
    displayName: `${projectName} - HTTP Errors`,
    userLabels: {},
    conditions: [
      {
        displayName: `Error Count`,
        conditionThreshold: {
          filter:
            pulumi.interpolate`
            resource.type = "cloud_run_revision" AND 
            resource.labels.service_name = "${cloudRun.name}" AND 
            metric.type = "run.googleapis.com/request_count" AND 
            metric.labels.response_code_class != "2xx"
            `,
          aggregations: [
            {
              alignmentPeriod: "300s",
              crossSeriesReducer: "REDUCE_NONE",
              perSeriesAligner: "ALIGN_COUNT",
            },
          ],
          comparison: "COMPARISON_GT",
          duration: "0s",
          trigger: {
            count: 1,
          },
          thresholdValue: 5,
        },
      },
    ],
    alertStrategy: {
      autoClose: "604800s",
    },
    combiner: "OR",
    enabled: true,
    notificationChannels: [notificationEmail.name],
  },
  {
    dependsOn: [cloudRun, notificationEmail],
  },
);

// Log Errors
new gcp.monitoring.AlertPolicy(
  "log-errors",
  {
    displayName: `${projectName} - Unexpected Errors`,
    userLabels: {},
    conditions: [
      {
        displayName: "Log contains runtime error",
        conditionMatchedLog: {
          filter:
            pulumi.interpolate`
            resource.type = "cloud_run_revision" AND
            resource.labels.service_name = "${cloudRun.name}" AND 
            textPayload=~"runtime error"`,
        },
      },
      {
        displayName: "Log contains error logging level",
        conditionMatchedLog: {
          filter:
            pulumi.interpolate`
            resource.type = "cloud_run_revision" AND
            resource.labels.service_name = "${cloudRun.name}" AND 
            textPayload=~"\"level\": \"error\""`,
        },
      },
    ],
    alertStrategy: {
      notificationRateLimit: {
        period: "3600s",
      },
      autoClose: "604800s",
    },
    combiner: "OR",
    enabled: true,
    notificationChannels: [notificationEmail.name],
  },
  {
    dependsOn: [cloudRun, notificationEmail],
  },
);

// Memory limit errors
new gcp.monitoring.AlertPolicy(
  "memory-limit-errors",
  {
    displayName: `${projectName} - Memory Limit Errors`,
    userLabels: {},
    conditions: [
      {
        displayName: "Log contains memory limit error",
        conditionMatchedLog: {
          filter:
            pulumi.interpolate`
            resource.type = "cloud_run_revision" AND
            resource.labels.service_name = "${cloudRun.name}" AND 
            textPayload=~"memory limit"`,
        },
      },
    ],
    alertStrategy: {
      notificationRateLimit: {
        period: "3600s",
      },
      autoClose: "604800s",
    },
    combiner: "OR",
    enabled: true,
    notificationChannels: [notificationEmail.name],
  },
  {
    dependsOn: [cloudRun, notificationEmail],
  },
);

/**
 * Exports
 */
export const cloudRunUrl = cloudRun.uri;
export const firebaseHostingUrl = firebaseHostingSite.defaultUrl;
