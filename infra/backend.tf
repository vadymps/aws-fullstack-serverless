terraform {
  backend "s3" {
    bucket         = "aws-fullstack-serverless-tfstate"
    key            = "terraform.tfstate"
    region         = "eu-central-1"
    profile        = "dev"
    encrypt        = true
    use_lockfile   = true
  }
}