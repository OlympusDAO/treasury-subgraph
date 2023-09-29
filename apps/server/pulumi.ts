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
        UPSTASH_REDIS_TOKEN: pulumiConfig.requireSecret("UPSTASH_REDIS_TOKEN"),
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
      containers: [
        {
          image: dockerImageGitCommit.imageName,
          resources: {
            limits: {
              memory: "256Mi",
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
              name: "UPSTASH_REDIS_TOKEN",
              value: pulumiConfig.requireSecret("UPSTASH_REDIS_TOKEN"),
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
    siteId: pulumiConfig.require("firebaseDomain"), // Will end up as <domain>.web.app
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

// Rewrite all requests to the Cloud Function
const firebaseHostingVersion = new gcp.firebase.HostingVersion(
  projectName,
  {
    siteId: firebaseSiteIdInput,
    config: {
      /**
       * Firebase hosting does not forward CORS headers to the Cloud Function
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
            serviceId: cloudRun.id,
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
 * Exports
 */
export const cloudRunUrl = cloudRun.uri;
export const firebaseHostingUrl = firebaseHostingSite.defaultUrl;
