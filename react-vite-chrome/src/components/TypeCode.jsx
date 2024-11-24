import PropTypes from "prop-types";

const TypeCode = (props) => {
  const { code = "ABCDEF" } = props;

  return (
    <div className="bg-white w-[260px] h-[100px] flex items-center justify-center">
      <p className="text-[hsl(0,0%,8%)] text-center text-[33px] not-italic font-medium leading-9 tracking-[16px]">
        {code}
      </p>
    </div>
  );
};

TypeCode.propTypes = {
  code: PropTypes.string,
};

export default TypeCode;
