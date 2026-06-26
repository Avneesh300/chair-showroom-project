import Address from "../models/address.model.js";
import asyncHandler from "../helpers/asyncHandler.js";
import responseSuccess from "../helpers/responseSuccess.js";
import responseError from "../helpers/responseError.js";

export const registerAddress =
  asyncHandler(async (req, res) => {
    const {
      id,
      fullName,
      mobile,
      address,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    if (!fullName) {
      return responseError(
        res,
        "Full Name is required",
        400
      );
    }

    if (!mobile) {
      return responseError(
        res,
        "Mobile is required",
        400
      );
    }

    if (!address) {
      return responseError(
        res,
        "Address is required",
        400
      );
    }

    if (id) {
      const updatedAddress =
        await Address.findByIdAndUpdate(
          id,
          {
            fullName,
            mobile,
            address,
            city,
            state,
            pincode,
            isDefault,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      return responseSuccess(
        res,
        "Address updated successfully",
        updatedAddress
      );
    }

    const newAddress =
      await Address.create({
        user: req.user._id,
        fullName,
        mobile,
        address,
        city,
        state,
        pincode,
        isDefault,
      });

    return responseSuccess(
      res,
      "Address added successfully",
      newAddress
    );
  });

export const getAllAddress =
  asyncHandler(async (req, res) => {
    const address =
      await Address.find({
        user: req.user._id,
      }).sort({
        createdAt: -1,
      });

    return responseSuccess(
      res,
      "Address fetched successfully",
      address
    );
  });

export const deleteAddress =
  asyncHandler(async (req, res) => {
    const { id } = req.body;

    await Address.findByIdAndDelete(
      id
    );

    return responseSuccess(
      res,
      "Address deleted successfully"
    );
  });