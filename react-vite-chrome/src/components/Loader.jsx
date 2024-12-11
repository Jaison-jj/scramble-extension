import LoaderIcon from "../assets/icons/loading.svg";
import { cn } from "../utils/cn";

const Loader = ({ isShow, className }) => {
  return (
    <div
      className={cn(
        "hidden h-[410px] w-[95%] authBackground rounded-md mx-auto  justify-center items-center",
        className,
        {
          flex: isShow,
        }
      )}
    >
      <img src={LoaderIcon} alt="loading" className="animate-rotate" />
    </div>
  );
};

export default Loader;
