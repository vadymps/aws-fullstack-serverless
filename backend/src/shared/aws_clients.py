import boto3

_COGNITO_CLIENT = None
_S3_CLIENT = None


def get_cognito_client():
    global _COGNITO_CLIENT
    if _COGNITO_CLIENT is None:
        _COGNITO_CLIENT = boto3.client("cognito-idp")
    return _COGNITO_CLIENT


def get_s3_client():
    global _S3_CLIENT
    if _S3_CLIENT is None:
        _S3_CLIENT = boto3.client("s3")
    return _S3_CLIENT
