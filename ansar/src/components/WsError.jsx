import { cn } from "../utils/cn";

const WsError = ({ isShow, message = "Something went wrong!" }) => {
  return (
    <div
      className={cn(
        "authBackground pt-[38px] w-[95%] h-[408px] rounded-md hidden  flex-col justify-center items-center gap-4 mx-auto",
        {
          flex: isShow,
        }
      )}
    >
      <p className="text-lg font-bold dark:text-white text-center">{message}</p>
      {/* <button
        onClick={onClickReload}
        className="px-6 py-2 bg-[#ffd000] rounded-lg font-semibold text-base"
      >
        Reload
      </button> */}
    </div>
  );
};

export default WsError;
