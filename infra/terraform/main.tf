terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend parcial: el resto de la configuración se provee con -backend-config.
  #
  # Producción:            AWS_PROFILE=amishi-prod terraform init -backend-config=backends/prod.tfbackend
  # Baja de la cuenta DEV: AWS_PROFILE=amishi-dev  terraform init -backend-config=backends/qa.tfbackend
  # CI: las credenciales vienen de variables de entorno (configure-aws-credentials action)
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  # En CI (GitHub Actions) aws_profile está vacío; las credenciales las inyecta
  # configure-aws-credentials a través de variables de entorno de AWS.
  # En local, el perfil nombrado del ~/.aws/config selecciona la cuenta correcta.
  profile = var.aws_profile != "" ? var.aws_profile : null
}

locals {
  # prod no lleva sufijo para mantener nombres limpios; qa sí.
  env_suffix  = var.environment == "prod" ? "" : "-${var.environment}"
  name_prefix = "${var.project_name}${local.env_suffix}"
  environment = var.environment
}
