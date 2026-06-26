import Contact from "../models/contact.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";
import sendEmail from "../config/sendEmail.js";

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name) return responseError(res, "Name is required", 400);
  if (!email) return responseError(res, "Email is required", 400);
  if (!message) return responseError(res, "Message is required", 400);

  // ✅ DB mein save karo
  await Contact.create({ name, email, phone, message });

  // ✅ Admin ko email bhejo
  await sendEmail(
    process.env.ADMIN_EMAIL,
    `New Contact Message from ${name}`,
    `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone || "Not provided"}</p>
      <p><b>Message:</b></p>
      <p>${message.replace(/\n/g, "<br/>")}</p>
    </div>
    `
  );

  // ✅ User ko confirmation email bhejo
  await sendEmail(
    email,
    "We received your message — SRS Chair Showroom",
    `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Thank you, ${name}!</h2>
      <p>We have received your message and will get back to you within 24 hours.</p>
      <p><b>Your message:</b></p>
      <p>${message.replace(/\n/g, "<br/>")}</p>
      <br/>
      <p>Regards,<br/>SRS Chair Showroom Team</p>
    </div>
    `
  );

  return responseSuccess(res, "Message sent successfully");
});