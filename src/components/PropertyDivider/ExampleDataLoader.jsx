// src/components/PropertyDivider/ExampleDataLoader.jsx

import React from 'react';

export const exampleData = [
  {
    id: 1,
    name: 'Roshelito',
    dod: '1997-02-08',
    gender: 'Male',
    spouseId: 2,
    parentId: null,
    isDeceased: true,
    properties: [
      {
        id: 1,
        name: 'Family Land',
        type: 'Land',
        totalSqm: 10000,
        classification: 'Conjugal'
      }
    ]
  },
  {
    id: 2,
    name: 'Daniela',
    dod: '1998-11-15',
    gender: 'Female',
    spouseId: 1,
    parentId: null,
    isDeceased: true,
    properties: []
  },
  {
    id: 3,
    name: 'Arjel',
    dod: '1998-01-01',
    gender: 'Male',
    spouseId: 4,
    parentId: 1,
    isDeceased: true,
    properties: []
  },
  {
    id: 4,
    name: 'Judy',
    dod: null,
    gender: 'Female',
    spouseId: 3,
    parentId: null,
    isDeceased: false,
    properties: []
  },
  {
    id: 5,
    name: 'Brenda',
    dod: null,
    gender: 'Female',
    spouseId: null,
    parentId: 3,
    isDeceased: false,
    properties: []
  },
  {
    id: 6,
    name: 'Reyna',
    dod: null,
    gender: 'Female',
    spouseId: null,
    parentId: 3,
    isDeceased: false,
    properties: []
  },
  {
    id: 7,
    name: 'Marljane',
    dod: '2025-12-12',
    gender: 'Female',
    spouseId: 8,
    parentId: 1,
    isDeceased: true,
    properties: []
  },
  {
    id: 8,
    name: 'Goku',
    dod: null,
    gender: 'Male',
    spouseId: 7,
    parentId: null,
    isDeceased: false,
    properties: []
  },
  {
    id: 9,
    name: 'Dodong',
    dod: null,
    gender: 'Male',
    spouseId: null,
    parentId: 7,
    isDeceased: false,
    properties: []
  },
  {
    id: 10,
    name: 'Arnestor',
    dod: '1996-03-12',
    gender: 'Male',
    spouseId: 11,
    parentId: 1,
    isDeceased: true,
    properties: []
  },
  {
    id: 11,
    name: 'Lippy',
    dod: null,
    gender: 'Female',
    spouseId: 10,
    parentId: null,
    isDeceased: false,
    properties: []
  },
  {
    id: 12,
    name: 'Sheryl',
    dod: null,
    gender: 'Female',
    spouseId: 13,
    parentId: 1,
    isDeceased: false,
    properties: []
  },
  {
    id: 13,
    name: 'Walter',
    dod: null,
    gender: 'Male',
    spouseId: 12,
    parentId: null,
    isDeceased: false,
    properties: []
  },
  {
    id: 14,
    name: 'Willie',
    dod: null,
    gender: 'Male',
    spouseId: null,
    parentId: 12,
    isDeceased: false,
    properties: []
  },
  {
    id: 15,
    name: 'Arnel',
    dod: null,
    gender: 'Male',
    spouseId: null,
    parentId: 12,
    isDeceased: false,
    properties: []
  },
  {
    id: 16,
    name: 'Angelito',
    dod: '2025-10-07',
    gender: 'Male',
    spouseId: null,
    parentId: 1,
    isDeceased: true,
    properties: []
  },
  {
    id: 17,
    name: 'Aira',
    dod: null,
    gender: 'Female',
    spouseId: 18,
    parentId: 1,
    isDeceased: false,
    properties: []
  },
  {
    id: 18,
    name: 'Dony',
    dod: null,
    gender: 'Male',
    spouseId: 17,
    parentId: null,
    isDeceased: false,
    properties: []
  },
  {
    id: 19,
    name: 'Asther',
    dod: null,
    gender: 'Female',
    spouseId: null,
    parentId: 17,
    isDeceased: false,
    properties: []
  }
];

export const ExampleDataLoader = ({ onLoad }) => {
  return (
    <button
      onClick={onLoad}
      type="button"
      style={{
        padding: '6px 14px',
        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
        color: 'white',
        border: 'none',
        borderRadius: '40px',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      📋 Load Example
    </button>
  );
};

export default ExampleDataLoader;