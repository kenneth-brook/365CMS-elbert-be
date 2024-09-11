const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize the SecretsManager client
const secretsManager = new SecretsManagerClient({
    region: "us-east-1"
});

async function getDatabaseCredentials() {
    const secretId = "rds!db-39dd4c27-6e7e-42fd-81ac-91e5ce44b030";
    console.log(`Attempting to retrieve secret: ${secretId}`);

    const command = new GetSecretValueCommand({ SecretId: secretId });

    try {
        const data = await secretsManager.send(command);
        console.log("Secret retrieved successfully:", data);

        // Check if the secret is a string and parse it
        if (data.SecretString) {
            console.log("Secret is in string format. Parsing...");
            return JSON.parse(data.SecretString);
        }

        // If the secret is in binary format, decode it
        if (data.SecretBinary) {
            console.log("Secret is in binary format. Decoding...");
            const buff = Buffer.from(data.SecretBinary, 'base64');
            return JSON.parse(buff.toString('utf-8'));
        }

        throw new Error("Secret retrieved, but no SecretString or SecretBinary found");

    } catch (error) {
        console.error("Failed to retrieve database credentials:", error);
        throw new Error("Failed to retrieve database credentials");
    }
}

module.exports = { getDatabaseCredentials };
