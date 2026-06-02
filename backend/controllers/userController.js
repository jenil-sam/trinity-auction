class UserController {

    async authenticateUser(req, res) {
        try {
            const { email, google_client_id } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: 'Email is required'
                });
            }

            return res.status(200).json({
                success: true
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }


    // 
}

export default new UserController();