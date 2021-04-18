import React from 'react'
import CardModel from '../../models/Card'
import './card.scss'

interface Props {
  card?: CardModel
  isSelected?: boolean
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

function Card(props: Props) {
  const image = props.card?.image
  const { isSelected, onClick } = props

  return (
    <div
      className={`card ${isSelected ? 'selected' : ''}`}
      style={image ? { backgroundImage: `url(${image})` } : {}}
      onClick={onClick}
    ></div>
  )
}

export default Card
