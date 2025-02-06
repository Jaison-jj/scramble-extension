import { cn } from "../utils/cn";

const NotSupportedUrl = ({ isShow }) => (
  <div
    className={cn(
      "hidden h-[410px] w-[95%] authBackground rounded-md mx-auto flex-col items-center justify-center px-5 pt-[32px]",
      {
        flex: isShow,
      }
    )}
  >
    <p className="font-semibold text-lg dark:text-white">
      This url is not supported!
    </p>
  </div>
);

export default NotSupportedUrl;
