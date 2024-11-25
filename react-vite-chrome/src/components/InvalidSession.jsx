const InvalidSession = () => {
  return (
    <div className="authBackground pt-[38px] w-[95%] h-[408px] rounded-md flex flex-col justify-center items-center gap-4">
      <p className="text-lg font-bold">Invalid session, please retry login</p>
      <button className="px-6 py-2 bg-[#ffd000] rounded-lg font-semibold">
        Reload
      </button>
    </div>
  );
};

export default InvalidSession;
