exports.handlePaynowIPN = async(req, res) => {
    try {
        const { reference, status } = req.body;

        // status: “Paid”, “Cancelled”, “Pending”, etc.
        console.log("IPN received:", req.body);

        // Update order status
        // Order.findOneAndUpdate({ reference }, { paymentStatus: status })

        return res.status(200).json({ message: "IPN received" });
    } catch (err) {
        console.error("IPN Error:", err);
        return res.status(500).json({ message: "IPN handler error" });
    }
};