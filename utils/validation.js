export const validate = (input, type) => {
  const inputType = typeof input;
  console.log(inputType);
  console.log(input);
  if (type === "string") {
    if (inputType !== "string") return false;
    return input.length > 0;
  }
  if (type === "email") {
    if (inputType !== "string") return false;
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(input);
  }
  if (type === "url") {
    // console.log(inputType);
    // console.log(input);
    // console.log(
    //   /^(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(
    //     input
    //   )
    // );
    // return;
    return (
      inputType === "string" &&
      /^(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(
        input
      )
    );
  }
  if (type === "password") {
    return inputType === "string" && input.length >= 6;
  }
  if (type === "alpha") {
    return inputType === "string" && /^[a-z\s]+$/i.test(input);
  }
  if (type === "alphanumeric") {
    return inputType === "string" && /^[a-z0-9\s]+$/i.test(input);
  }

  return false;
};
