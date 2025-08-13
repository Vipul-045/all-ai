import mongoose, { Model } from "mongoose";

interface IUser extends mongoose.Document {
  email: string;
  passwordhash: string;
  userRole:string;
}

const UserSchema = new mongoose.Schema(
  {
    email: String,
    passwordhash: String,
    userRole: String
  },
  {
    timestamps: true,
  }
);

const UserModel: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default UserModel;
