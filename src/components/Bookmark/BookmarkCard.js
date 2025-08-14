import React from 'react'
import styles from '../../styles/bookmark.module.css'

const BookmarkCard = ({ data }) => {
  return (
    <a className={styles.card} href={data.url} target="_blank" rel="noopener noreferrer">
      <img src={data.images?.[0]} alt={data.title} className={styles.image} />
      <div>
        <h4>{data.title}</h4>
        <p>{data.description}</p>
      </div>
    </a>
  )
}

export default BookmarkCard
