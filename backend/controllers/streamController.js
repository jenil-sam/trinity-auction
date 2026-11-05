import ivsService from "../services/ivsService.js";

// Only user ids listed in HOST_USER_IDS (comma separated) may publish to the stage.
// Everyone else who is signed in gets a viewer token.
function isHost(userId) {
    const hostIds = (process.env.HOST_USER_IDS || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    return hostIds.includes(String(userId));
}

class StreamController {

    async createToken(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not signed in' });
            }

            // the role is decided on the server, not by the client
            const role = isHost(userId) ? "HOST" : "VIEWER";
            const token = await ivsService.createToken(role);
            return res.status(200).json({
                token,
                role
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }

}

export default new StreamController();
