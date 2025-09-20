import { Button, ButtonIcon, ButtonText } from "@components/ui/button";
import { Heading } from "@components/ui/heading";
import { CloseIcon, Icon } from "@components/ui/icon";
import {
    Popover,
    PopoverArrow,
    PopoverBackdrop,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
} from "@components/ui/popover";
import { Text } from "@components/ui/text";
import { X } from "lucide-react-native";
import React from "react";

import { HStack } from "@/src/components/ui/hstack";

import { Portal } from "@/src/components/ui/portal";
import { VStack } from "@/src/components/ui/vstack";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { TouchableWithoutFeedback } from 'react-native';


export const TestComponent = () => {
  const [showPopover, setShowPopover] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const handleClose2 = () => setVisible(false);
  const handleOpen = () => {
    setIsOpen(true);
  };
  const handleClose = () => {
    setIsOpen(false);
  };
  return (
    <OverlayProvider>
      <VStack>
        <TouchableWithoutFeedback>
        <Popover
          size={"sm"}
          shouldFlip
          isOpen={showPopover}
          onOpen={() => {
            setShowPopover(true);
          }}
          onClose={() => {
            setShowPopover(false);
          }}
          trigger={(triggerProps: any) => {
            return (
              <Button {...triggerProps}>
                <ButtonText>Popover</ButtonText>
              </Button>
            );
          }}
        >
          <PopoverBackdrop />
          <PopoverContent className="max-w-[400]">
            <PopoverArrow />
            <PopoverHeader>
              <Heading>Welcome!</Heading>
              <PopoverCloseButton>
                <Icon as={X} size="lg" />
              </PopoverCloseButton>
            </PopoverHeader>
            <PopoverBody>
              <Text>
                Join the product tour and start creating your own checklist. Are
                you ready to jump in?
              </Text>
            </PopoverBody>
            <PopoverFooter>
              <Text size="xs" className="flex-1">
                Step 2 of 3
              </Text>
              {}
              <Button
                variant="outline"
                action="secondary"
                className="mr-3"
                onPress={() => {
                  setShowPopover(false);
                }}
              >
                <ButtonText>Back</ButtonText>
              </Button>
              <Button
                onPress={() => {
                  setShowPopover(false);
                }}
              >
                <ButtonText>Next</ButtonText>
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </TouchableWithoutFeedback>
        <Portal isOpen={visible}>
          <HStack className="border-2 w-1/3 py-10 gap-4 rounded-lg flex-row justify-center items-center bg-background-0">
            <Text className="text-typography-950">Portal Content</Text>
            <Button
              size="xs"
              className="h-6 px-1 absolute top-2 right-2"
              variant="outline"
              onPress={handleClose2}
            >
              <ButtonIcon as={CloseIcon} />
            </Button>
          </HStack>
        </Portal>
        <Button onPress={() => setVisible(!visible)}>
          <ButtonText>Toggle Portal</ButtonText>
        </Button>
      </VStack>
    </OverlayProvider>
  );
};
export default TestComponent;
