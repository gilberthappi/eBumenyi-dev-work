
const getLineStyle = (i) => {
  const rotation = 30 * i;
  const delay = i * -0.0833;
  return {
    transform: `rotate(${rotation}deg) translateY(-13px)`,
    animationDelay: `${delay}s`,
  };
};

const PrimaryLoader = () => {
  return (
    <>
      <div className='relative w-full h-full'>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`line absolute top-[90%] left-[45%] w-1 h-3 bg-[#1a293a] rounded-[2px] origin-[center_-16px] animate-fade`}
            style={getLineStyle(i)}
          />
        ))}
      </div>
    </>
  );
};

export default PrimaryLoader;
