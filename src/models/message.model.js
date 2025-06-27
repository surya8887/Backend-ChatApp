import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    content: String,
    attachment: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;