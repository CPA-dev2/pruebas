import React from "react";
import { Text } from "@chakra-ui/react";

const SubTitle = ({ content, textColor }) => {
  return (
    <Text mb="36px" ms="4px" color={textColor} fontWeight="400" fontSize="md">
      {content}
    </Text>
  );
};

export default SubTitle;
