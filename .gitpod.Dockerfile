FROM gitpod/workspace-node-lts

# gcloud
# Source: https://github.com/vfarcic/gitpod-production
ARG GCLOUD_FILE=google-cloud-sdk-449.0.0-linux-x86_64.tar.gz
RUN curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/${GCLOUD_FILE} && \
    tar -xzvf ${GCLOUD_FILE} -C /home/gitpod/ && \
    rm ${GCLOUD_FILE}
ENV PATH $PATH:/home/gitpod/google-cloud-sdk/bin/

# pulumi
ARG PULUMI_FILE=pulumi-v3.86.0-linux-x64.tar.gz
RUN curl -O https://get.pulumi.com/releases/sdk/${PULUMI_FILE} && \
    tar -xzvf ${PULUMI_FILE} -C /home/gitpod/ && \
    rm ${PULUMI_FILE}
ENV PATH $PATH:/home/gitpod/pulumi/

# zsh shell
RUN sudo apt-get update && \
    sudo apt-get install -y zplug && \
    sudo apt-get clean
