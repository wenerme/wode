import { Calculator } from "./Calculator";
import { Meta, Story } from "@storybook/react/types-6-0";
import styled from "styled-components";

export default {
  title: "Applications/Calculator",
  component: Calculator,
} as Meta;
const Wrapper = styled.div`
  @import url("https://fonts.googleapis.com/css?family=Roboto:100");
`;
const Template: Story<any> = (args) => (
  <Wrapper>
    <Calculator {...args} />
  </Wrapper>
);

export const Default = Template.bind({});
