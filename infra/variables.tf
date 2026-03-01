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

variable "lambda_runtime" {
  type        = string
  description = "Lambda runtime"
  default     = "python3.12"
}

variable "lambda_handler" {
  type        = string
  description = "Lambda handler"
  default     = "app.handler"
}

variable "lambda_timeout" {
  type        = number
  description = "Lambda function timeout in seconds"
  default     = 5
}

variable "mongodb_uri" {
  type        = string
  description = "MongoDB Atlas connection URI"
  sensitive   = true
}

variable "mongodb_db" {
  type        = string
  description = "MongoDB database name"
  default     = "sample_mflix"
}
