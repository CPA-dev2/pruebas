import React from "react";
import { Heading } from "@chakra-ui/react";

const Title = ({ content, textColor }) => {
  return (
    <Heading color={textColor} fontSize="36px" mb="10px">
      {content}
    </Heading>
  );
};

export default Title;
