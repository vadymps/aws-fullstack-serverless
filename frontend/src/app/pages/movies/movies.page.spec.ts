import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MoviesPageComponent } from './movies.page';
import { MovieService } from '../../services/movie.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';

describe('MoviesPageComponent', () => {
  let component: MoviesPageComponent;

  const movieService = {
    getMovies: jest.fn(),
    searchMovies: jest.fn()
  };
  const favoritesService = {
    getFavoriteIds: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn()
  };
  const authService = {
    init: jest.fn(),
    isAuthenticated: jest.fn(),
    login: jest.fn()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MovieService, useValue: movieService },
        { provide: FavoritesService, useValue: favoritesService },
        { provide: AuthService, useValue: authService }
      ]
    });

    const injector = TestBed.inject(EnvironmentInjector);
    component = runInInjectionContext(injector, () => new MoviesPageComponent());
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('debounces search input and loads movies with trimmed query', () => {
    const loadSpy = jest.spyOn(component, 'loadMovies').mockImplementation(() => {});

    component.onSearchInput('  star  ');
    expect(component.query()).toBe('star');
    expect(loadSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(loadSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(loadSpy).toHaveBeenCalledWith(1, 'star');
  });

  it('nextPage loads next page when not loading and page < totalPages', () => {
    const loadSpy = jest.spyOn(component, 'loadMovies').mockImplementation(() => {});
    component.loading.set(false);
    component.page.set(1);
    component.total.set(50);
    component.pageSize.set(12);

    component.nextPage();
    expect(loadSpy).toHaveBeenCalledWith(2);
  });

  it('prevPage loads previous page when not loading and page > 1', () => {
    const loadSpy = jest.spyOn(component, 'loadMovies').mockImplementation(() => {});
    component.loading.set(false);
    component.page.set(3);

    component.prevPage();
    expect(loadSpy).toHaveBeenCalledWith(2);
  });
});
