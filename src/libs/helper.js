const getOtherMember = (userId, members) =>
  members.find((m) => m._id.toString() !== userId.toString());