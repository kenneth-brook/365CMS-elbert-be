const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize the SecretsManager client
const secretsManager = new SecretsManagerClient({
    region: "us-east-1"
});

async function getDatabaseCredentials() {
    const command = new GetSecretValueCommand({ SecretId: "rds!db-39dd4c27-6e7e-42fd-81ac-91e5ce44b030" });

    try {
        const data = await secretsManager.send(command);
        // Check if the secret comes as a string and parse it
        if (data.SecretString) {
            return JSON.parse(data.SecretString);
        }
        // If the secret comes as binary (less common), handle appropriately
        const buff = Buffer.from(data.SecretBinary, 'base64');
        return JSON.parse(buff.toString('utf-8'));
    } catch (error) {
        console.error("Failed to retrieve database credentials:", error);
        throw new Error("Failed to retrieve database credentials");
    }
}

module.exports = { getDatabaseCredentials };