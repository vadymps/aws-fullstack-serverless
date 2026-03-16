terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  project_name      = "aws-fullstack-serverless"
  aws_region        = "eu-central-1"
  aws_profile       = "dev"
  state_bucket_name = "${local.project_name}-tfstate"
  lock_table_name   = "${local.project_name}-tflock"
}

provider "aws" {
  region  = local.aws_region
  profile = local.aws_profile
}

resource "aws_s3_bucket" "tf_state" {
  bucket        = local.state_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "tf_lock" {
  name         = local.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
