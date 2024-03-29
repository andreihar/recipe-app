import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Recipe } from '../models/Recipe';
import { User } from '../models/User';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare, faClock, faBowlRice, faThumbsUp as faThumbsUpL } from '@fortawesome/free-solid-svg-icons';
import {faThumbsUp as faThumbsUpN } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DbService from '../services/DbService';

function Display() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe>();
  const [author, setAuthor] = useState<User>();
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(0);
  const [viewAlsoRecipes, setViewRecipes] = useState<Recipe[]>([]);
  const {authUser, isLogged} = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const recipes = await DbService.getRecipes();
      setViewRecipes(recipes.filter(recipe => recipe.rid !== Number(id)).sort(() => Math.random() - 0.5).slice(0, 4));
      const foundRecipe = await DbService.getRecipeById(Number(id));
      const foundAuthor = foundRecipe && await DbService.getUserByName(foundRecipe.username);
      if (foundRecipe && foundAuthor) {
        setRecipe(foundRecipe);
        setAuthor(foundAuthor);
        if (isLogged) setUserLiked(await DbService.getUserLikedRecipe(Number(id)));
        setLikes(await DbService.getLikesForRecipe(Number(id)));
      } else {
        alert (t('display.error'));
        navigate('/');
        return;
      }
    };
    loadData();

  }, [id]);

  const deleteRecipe = () => {
    if (window.confirm(`${t('display.delete.part1')} ${recipe!.title}${t('display.delete.part2')}`)) {
      DbService.deleteRecipe(Number(id));
      navigate('/');
    }
  }

  const handleLike = async () => {
    if (userLiked) {
      await DbService.unlikeRecipe(Number(id));
      setLikes(Number(likes) - 1);
    } else {
      await DbService.likeRecipe(Number(id));
      setLikes(Number(likes) + 1);
    }
    setUserLiked(!userLiked);
  }

  if (recipe) {
    const { picture, title, chin_title, created_on, time_last_modified, cuisine, ingredients, recipe_instructions, prep_time, cook_time, servings } = recipe;
    return (
    <>
      <Navbar/>
      <div className="p-5 text-center bg-image text-uppercase position-relative" style={{ backgroundImage: `url(${picture})`}}>
        <div className="mask position-absolute top-0 start-0 bottom-0 end-0">
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="text-white">
              <h1 className="mb-3">
                {i18n.language === 'en' ? `${title} | ${chin_title}` : `${chin_title} | ${title}`}
              </h1>
              <h4 className="mb-3">{t('display.authentic.part1')}{`${cuisine}`}{t('display.authentic.part2')}</h4>
            </div>
          </div>
        </div>
      </div>
      <div className="angled-div" />
      
      <main className="container">
        <div className="row g-5">
          <div className="col-md-8">
            <article className="blog-post">
              <h2 className="display-5 link-body-emphasis mb-1">{t('display.letsMake.part1')}<span className="text-primary">{i18n.language === 'en' ? `${title}` : `${chin_title}`}</span>{t('display.letsMake.part2')}</h2>
              <div className="text-dark-emphasis align-items-center d-flex justify-content-between">
                <div>
                  <Link to={`/user/${author!.username}`} className="text-dark-emphasis align-items-center d-flex">
                  {/* <a href={author!.social} target="_blank" rel="noopener noreferrer" className="text-dark-emphasis align-items-center d-flex"> */}
                  {t('display.by')}
                    <img src={author!.picture} alt="User Picture" width={32} height={32} className="rounded-circle ms-2"/>
                    <span className="text-uppercase fs-5 ms-2">
                      {i18n.language === 'en' ? `${author?.first_name} ${author?.last_name}` : `${author?.last_name} ${author?.first_name}`}
                    </span>
                  </Link>
                </div>
                <div className="align-items-center d-flex fs-5">
                  <button 
                    onClick={handleLike} 
                    className="btn" 
                    disabled={!isLogged} 
                    style={{border: 'none'}}
                  >
                    <FontAwesomeIcon icon={userLiked ? faThumbsUpL : faThumbsUpN} />
                  </button>
                {likes}
                </div>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <p className="text-dark-emphasis">
                  {t('display.posted')} <span className="">{`${created_on.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`}</span>&nbsp;|&nbsp;
                  {t('display.updated')} <span className="">{`${time_last_modified.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`}</span>
                </p>
                {isLogged && (authUser.username === author!.username) &&
                  <div>
                    <button onClick={deleteRecipe} className="btn btn-outline-danger"><FontAwesomeIcon icon={faTrash} /></button>
                    <button onClick={() => navigate('/form/' + id)} className="btn btn-outline-secondary ms-2"><FontAwesomeIcon icon={faPenToSquare} /></button>
                  </div>
                }
              </div>
              <h2>{t('form.ingredients')}</h2>
              <p>{t('display.ingredientDesc.part1')}{i18n.language === 'en' ? `${title}` : `${chin_title}`}{t('display.ingredientDesc.part2')}</p>
              <ul>
                {ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
              <h2>{t('form.directions')}</h2>
              <p>{t('display.stepsDesc.part1')}{i18n.language === 'en' ? `${title}` : `${chin_title}`}{t('display.stepsDesc.part2')}</p>
              <ol>
                {recipe_instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </article>
          </div>
          <div className="col-md-4">
            <div className="position-sticky" style={{ top: "90px" }}>
              <div className="p-4 mb-3 bg-body-tertiary rounded">
                <h4 className="fst-italic">{t('display.about')}<span className="text-primary">{i18n.language === 'en' ? `${title}` : `${chin_title}`}</span></h4>
                <p className="mb-2"><FontAwesomeIcon icon={faClock} className="text-primary" /> <span className="text-uppercase">{t('display.prep')}</span> <span className="text-dark-emphasis">{`${prep_time} `}{t('display.mins')}</span> <span className="ms-1 text-uppercase">{t('display.cook')}</span> <span className="text-dark-emphasis">{`${cook_time} `}{t('display.mins')}</span></p>
                <p><span className="text-uppercase"><FontAwesomeIcon icon={faBowlRice} className="text-primary" /> {t('display.serves')}</span> <span className="text-dark-emphasis">{`${servings} ${servings > 1 ? t('display.people') : t('display.person')}`}</span></p>
                <p className="mb-0">{t('display.aboutText')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="album mt-5 bg-body-tertiary">
        <div className="container-fluid">
          <div className="row d-flex align-items-stretch">
            {viewAlsoRecipes.map((viewRecipe, index) => (
              <div key={index} className="col-12 col-sm-6 col-lg-3 p-0">
                <Link to={`/recipe/${viewRecipe.rid}`}>
                  <div className="card text-bg-dark h-100 rounded-0 border-0 hover-effect position-relative">
                    <img src={`${viewRecipe.picture}`} className="card-img rounded-0" style={{ height: '13rem', objectFit: 'cover' }} alt="..." />
                    <div className="card-img-overlay text-uppercase">
                      <h5 className="bg-primary card-title position-absolute bottom-0 left-0 py-1 px-2 fs-6 fw-normal" style={{color: 'inherit', transition: 'none'}}>{i18n.language === 'en' ? `${viewRecipe.title}` : `${viewRecipe.chin_title}`}</h5>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  )
  }
}

export default Display
