# Postmark Client

Postmark client for Ghost

## Usage

You can add the following to your config to start sending emails using Postmark:

```json
{
    "bulkEmail": {
        "postmark": {
            "apiToken": "your-api-token",
            "streamId": "broadcast"
        }
    }
}
```

## Test

- `yarn lint` run just eslint
- `yarn test` run lint and tests

