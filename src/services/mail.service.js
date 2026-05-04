import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
	if (transporter) return transporter;

	const smtpHost = process.env.SMTP_HOST;
	const smtpPort = Number(process.env.SMTP_PORT || 587);
	const smtpUser = process.env.SMTP_USER;
	const smtpPass = process.env.SMTP_PASS;
	const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

	if (!smtpHost || !smtpUser || !smtpPass || process.env.NODE_ENV === 'test') {
		transporter = nodemailer.createTransport({
			jsonTransport: true,
		});
		return transporter;
	}

	transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpSecure,
		auth: {
			user: smtpUser,
			pass: smtpPass,
		},
	});

	return transporter;
};

const getMailFrom = () => {
	return process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@bildyapp.test';
};

const sendVerificationEmail = async ({ email, code }) => {
	const from = getMailFrom();
	const subject = 'Código de verificación de BildyApp';
	const html = `
		<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
			<h2 style="margin-bottom: 16px;">Verifica tu email</h2>
			<p>Hola,</p>
			<p>Tu código de verificación para BildyApp es:</p>
			<div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 24px 0; padding: 16px; background: #f5f5f5; display: inline-block;">
				${code}
			</div>
			<p>Este código caduca en breve. Si no has solicitado esta cuenta, puedes ignorar este correo.</p>
		</div>
	`;

	return getTransporter().sendMail({
		from,
		to: email,
		subject,
		html,
		text: `Tu código de verificación de BildyApp es: ${code}`,
	});
};

export { getTransporter, sendVerificationEmail };
