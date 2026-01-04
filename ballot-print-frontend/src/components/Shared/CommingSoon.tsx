import React from 'react';

const CommingSoon: React.FC = () => {
  return (
    <div className="h-[calc(100vh-130px)] text-postDarkest ml-96">
      <div className="flex justify-center items-center ">
        <p className="text-6xl font-bold">C</p>
        <div className="w-9 h-9 border-8 border-dashed pt-1 rounded-full animate-spin mt-3 border-success-400"></div>
        <p className="text-6xl font-bold">ming S</p>
        <div className="w-9 h-9 border-8 pt-1 border-dashed rounded-full animate-spin mt-3 border-success-400"></div>
        <div className="w-9 h-9 border-8 border-dashed rounded-full animate-spin mt-3 border-success-400"></div>
        <p className="text-6xl font-bold">n.</p>
      </div>
    </div>
  );
};

export default CommingSoon;
