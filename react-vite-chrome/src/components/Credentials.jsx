import { cn } from "../utils/cn";
import TextInput from "./utils/TextInput";
import PropTypes from "prop-types";

const Credentials = ({ isShow, userId = "sample", password = "sample" }) => {
  return (
    <div
      className={cn(
        "hidden h-[344px] w-[95%] authBackground rounded-md mx-auto  flex-col items-start px-5 pt-[32px]",
        {
          flex: isShow,
        }
      )}
    >
      <p className="pb-[40px] text-xl font-switzer font-thin max-w-[270px] dark:text-white">
        ScrambleID generated login ID for{" "}
        <span className="font-semibold">“Democorp”</span>
      </p>
      <div className="flex flex-col gap-5 w-full">
        <TextInput
          type="text"
          htmlFor="username"
          name="username"
          label="User ID"
          value={userId}
        />
        <TextInput
          type="text"
          htmlFor="password"
          name="password"
          label="Password"
          value={password}
        />
      </div>
    </div>
  );
};

Credentials.propTypes = {
  isShow: PropTypes.bool,
  userId: PropTypes.string,
  password: PropTypes.string,
};

export default Credentials;
