// Chakra Imports
import { Button, Icon, useColorMode } from "@chakra-ui/react";
// Custom Icons
import { IoMdMoon, IoMdSunny } from "react-icons/io";
import React from "react";

const FixedPlugin = (props) => {
  const { ...rest } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  let bgButton = "linear-gradient(135deg, #00b8b0 0%, #006662 100%)";

  return (
    <Button
      {...rest}
      h="60px"
      w="60px"
      zIndex="99"
      bg={bgButton}
      position="fixed"
      variant="no-effects"
      left={document.documentElement.dir === "rtl" ? "35px" : ""}
      right={document.documentElement.dir === "rtl" ? "" : "35px"}
      bottom="30px"
      border="1px solid"
      borderColor="#00b8b0"
      borderRadius="50px"
      onClick={toggleColorMode}
      display="flex"
      p="0px"
      align="center"
      justify="center"
    >
      <Icon
        h="24px"
        w="24px"
        color="white"
        as={colorMode === "light" ? IoMdMoon : IoMdSunny}
      />
    </Button>
  );
};

export default FixedPlugin;
