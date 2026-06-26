import Setting from "../models/setting.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";

// ✅ Settings get karo — agar nahi hai toh default bana do
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  return responseSuccess(res, "Settings fetched successfully", settings);
});

// ✅ Settings save karo
export const saveSettings = asyncHandler(async (req, res) => {
  const body = req.body;

  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create(body);
  } else {
    Object.keys(body).forEach((key) => {
      settings[key] = body[key];
    });
    await settings.save();
  }

  return responseSuccess(res, "Settings saved successfully", settings);
});