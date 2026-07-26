variable "aws_region" {
  description = "AWS region where all resources are deployed"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment: 'qa' (dev account) or 'prod' (prod account)"
  type        = string
  validation {
    condition     = contains(["qa", "prod"], var.environment)
    error_message = "environment must be 'qa' or 'prod'."
  }
}

variable "aws_profile" {
  description = "AWS CLI named profile for local deploys. Leave empty in CI (credentials come from environment variables)."
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
  default     = "amishi"
}

variable "admin_email" {
  description = "Admin email for the CMS login"
  type        = string
  sensitive   = true
}

variable "admin_password" {
  description = "Admin password for the CMS login"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "JWT signing secret (minimum 32 random characters)"
  type        = string
  sensitive   = true
}

variable "cors_origins" {
  description = "Comma-separated list of allowed CORS origins (e.g. https://amishi.vercel.app)"
  type        = string
  default     = ""
}
