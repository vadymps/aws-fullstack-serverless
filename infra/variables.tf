variable "project_name" {
  type        = string
  description = "Project name prefix for resource naming"
  default     = "aws-fullstack-serverless"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "eu-central-1"
}

variable "aws_profile" {
  type        = string
  description = "AWS profile"
  default     = "dev"
}

variable "mongodb_uri" {
  type        = string
  description = "MongoDB Atlas connection URI"
  sensitive   = true
}
