import React, { useState } from 'react'
import CardModel from '../../models/Card'
import './card.scss'

interface Props {
  card: CardModel
}

function Card(props: Props) {
  const { image } = props.card
  const [isSelected, setIsSelected] = useState(false)

  const toggleSelection = () => {
    setIsSelected(!isSelected)
  }

  return (
    <div
      className={`card ${isSelected ? 'selected' : ''}`}
      style={{ backgroundImage: `url(${image})` }}
      onClick={toggleSelection}
    ></div>
  )
}

export default Card
