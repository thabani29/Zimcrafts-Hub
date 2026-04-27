const { sendEmail } = require('../utils/sendEmail');

const formatDateTime = (value) => (
    value ? new Date(value).toLocaleString() : 'just now'
);

const sendTutorialEnrollmentRequestEmail = async({ artisan, customer, tutorial, request }) => {
    if (!artisan?.email || !customer || !tutorial || !request) {
        throw new Error('Missing data for tutorial enrollment request email');
    }

    return sendEmail({
        to: artisan.email,
        subject: `New tutorial enrollment request: ${tutorial.title}`,
        html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Hello ${artisan.name || 'Artisan'},</h2>
            <p>You have a new tutorial enrollment request.</p>
            <p><strong>Customer:</strong> ${customer.name || 'Customer'}</p>
            <p><strong>Email:</strong> ${customer.email || 'Not provided'}</p>
            <p><strong>Tutorial:</strong> ${tutorial.title}</p>
            <p><strong>Requested:</strong> ${formatDateTime(request.createdAt)}</p>
            ${request.message ? `<p><strong>Customer note:</strong> ${request.message}</p>` : ''}
            <p>Please log into your dashboard to approve or reject this request.</p>
        </div>
        `,
    });
};

const sendTutorialRequestDecisionEmail = async({ customer, tutorial, request }) => {
    if (!customer?.email || !tutorial || !request) {
        throw new Error('Missing data for tutorial request decision email');
    }

    const decision = String(request.status || '').toUpperCase();
    const approved = decision === 'APPROVED';

    return sendEmail({
        to: customer.email,
        subject: `Tutorial request ${approved ? 'approved' : 'updated'}: ${tutorial.title}`,
        html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Hello ${customer.name || 'Customer'},</h2>
            <p>Your enrollment request for <strong>${tutorial.title}</strong> has been <strong>${decision}</strong>.</p>
            <p>${approved ? 'You can now access the tutorial from your account.' : 'Please contact the artisan if you need more information.'}</p>
        </div>
        `,
    });
};

module.exports = {
    sendTutorialEnrollmentRequestEmail,
    sendTutorialRequestDecisionEmail,
};
