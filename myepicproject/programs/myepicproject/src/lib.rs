use anchor_lang::prelude::*;

declare_id!("7G8YtgBXU5At9xssEwbxYDg2AKuc8k17UA9kcukC8Qts");

/*
 * Program is similar to a smart contract. Functions inside the pub mod <Program Name> is
 * called instructions. These use an account inside the Context to modify/store data on an account
*/
#[program]
pub mod myepicproject {
    use super::*;
    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        // Build the struct
        let item = ItemStruct {
            gif_link,
            user_address: *ctx.accounts.user.key,
            votes: 0,
        };

        // Add it to the gif_list vector
        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn update_gif(ctx: Context<UpdateGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        let gif_list = &mut base_account.gif_list;
        
        for gif in gif_list {
            if gif.gif_link == gif_link {
                gif.votes += 1
            }
        }
        Ok(())
    }

    pub fn send_sol(ctx: Context<SendSol>, amount: u64) -> ProgramResult {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.from.key(),
            &ctx.accounts.to.key(),
            amount, // in lamports
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.to.to_account_info(),    
            ],
        )

    }

}

// Specify what data you want in the StartStuffOff Context.
// How an account will be initilized
#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer=user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Specify what data you want in the AddGif Context.
#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    pub user: Signer<'info>
}

#[derive(Accounts)]
pub struct UpdateGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[derive(Accounts)]
pub struct SendSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// Create a custom struct for us to work with.
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub votes: u8,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}