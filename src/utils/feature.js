const emitEvent = (req, event, user, data) => {
  console.log(` Emitting event: ${event} for user: ${user}`);
};


export { emitEvent };