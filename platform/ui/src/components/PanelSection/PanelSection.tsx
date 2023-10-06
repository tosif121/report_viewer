import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TextEditor from '../../NewComponents/TextEditor';

const PanelSection = ({ title, children, actionIcons = [] }) => {
  const [areChildrenVisible, setChildrenVisible] = useState(true);

  const handleHeaderClick = () => {
    setChildrenVisible(!areChildrenVisible);
  };

  return (
    <>
      <TextEditor />
    </>
  );
};

PanelSection.defaultProps = {};

PanelSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  actionIcons: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
};

export default PanelSection;
