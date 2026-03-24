import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE) === "true",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

export async function sendResetPasswordCodeEmail(params: {
    to: string;
    name: string;
    code: string;
}) {
    const { to, name, code } = params;

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Đặt lại mật khẩu</h2>
      <p>Xin chào ${name},</p>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Mã xác nhận của bạn là:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 16px 0; color: #2563eb;">
        ${code}
      </div>
      <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
    </div>
  `;

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: "Mã đặt lại mật khẩu",
        html,
    });
}