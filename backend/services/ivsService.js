import { IVSRealTimeClient, CreateParticipantTokenCommand } from "@aws-sdk/client-ivs-realtime";


const client = new IVSRealTimeClient({ region: process.env.AWS_REGION });


class IvsService {
  async createToken(role) {
    const capabilities = role === "HOST" ? ["PUBLISH", "SUBSCRIBE"] : ["SUBSCRIBE"];

    const command = new CreateParticipantTokenCommand({
      stageArn: process.env.IVS_STAGE_ARN,
      capabilities,
    });

    const response = await client.send(command);
    return response.participantToken.token;
  }
}

export default new IvsService();