variable "project_name" {
  type        = string
  description = "Project name prefix for resource naming"
  default     = "aws-fullstack-serverless"
}

variable "s3_bucket_name" {
  type        = string
  description = "Optional S3 bucket name for the frontend site (leave empty to auto-generate)"
  default     = ""
}

variable "lambda_runtime" {
  type        = string
  description = "Lambda runtime"
  default     = "python3.11"
}

variable "lambda_handler" {
  type        = string
  description = "Lambda handler"
  default     = "app.handler"
}
