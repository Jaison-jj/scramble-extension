
import LoaderIcon from "../assets/icons/loading.svg"

const Loader = () => {
  return (
    <div className="h-[344px] w-[95%] authBackground rounded-md mx-auto flex justify-center items-center">
      <img src={LoaderIcon} alt="loading" className="animate-rotate" />
    </div>
  );
};

export default Loader;
