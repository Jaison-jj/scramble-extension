import TextInput from "./utils/TextInput";

const Credentials = () => {
  return (
    <div className="h-[344px] w-[95%] authBackground rounded-md mx-auto flex flex-col items-start px-5 pt-[32px]">
      <p className="pb-[40px] text-xl font-switzer font-thin max-w-[270px] dark:text-white">
        ScrambleID generated login ID for <span className="font-semibold">“Democorp”</span>
      </p>
      <div className="flex flex-col gap-5 w-full">
        <TextInput
          type="text"
          htmlFor="username"
          name="username"
          label="User ID"
          value="value"
        />
        <TextInput
          type="password"
          htmlFor="password"
          name="password"
          label="Password"
          value="123qwe"
        />
      </div>
    </div>
  );
};

export default Credentials;
