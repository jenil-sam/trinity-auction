import ivsService from "../services/ivsService.js";

class StreamController {

    async createToken(req, res) {
        try {
            const { role } = req.body;
            if (!role) {
                return res.status(400).json({
                    error: 'Role is required'
                });
            }
            const token = await ivsService.createToken(role);
            return res.status(200).json({
                token
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