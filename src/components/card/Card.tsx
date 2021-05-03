import React from 'react'
import OfflineCardModel from '../../models/offline/Card'
import OnlineCardModel from '../../models/online/Card'
import './card.scss'

interface Props {
  card?: OfflineCardModel | OnlineCardModel
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
